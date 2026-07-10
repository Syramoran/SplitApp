import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupsService } from './groups.service';

describe('GroupsService (crear grupo)', () => {
  let service: GroupsService;
  let saved: Group | undefined;

  beforeEach(() => {
    saved = undefined;
    const groupsRepo = {
      create: jest.fn((dto: object) => dto as Group),
      save: jest.fn((group: Group) => {
        saved = group;
        return Promise.resolve({ ...group, id: 'g1' });
      }),
    };
    const membersRepo = {
      create: jest.fn((dto: object) => dto as GroupMember),
    };
    const usersRepo = {
      findOneByOrFail: jest.fn(() =>
        Promise.resolve({ id: 'u-agos', name: 'Agos', avatarColor: 'lilac' }),
      ),
    };
    service = new GroupsService(
      groupsRepo as never,
      membersRepo as never,
      usersRepo as never,
      {} as never,
    );
  });

  it('crea el grupo con el creador como miembro más los participantes por nombre', async () => {
    await service.create('u-agos', {
      name: 'Depto Palermo',
      type: 'convivencia',
      members: ['Tomi', 'Fede'],
    });

    expect(saved?.members).toHaveLength(3);
    const [me, tomi, fede] = saved!.members;
    expect(me.userId).toBe('u-agos');
    expect(me.displayName).toBe('Agos');
    // Participantes fantasma: solo un nombre, sin cuenta (principio 4)
    expect(tomi.userId).toBeNull();
    expect(tomi.displayName).toBe('Tomi');
    expect(fede.userId).toBeNull();
    expect(saved?.defaultSplitType).toBe('equal');
    expect(saved?.color).toBe('lilac');
  });

  it('pareja con slider proporcional: guarda 60/40 como división por defecto', async () => {
    await service.create('u-agos', {
      name: 'Caro & Nico',
      type: 'pareja',
      members: ['Nico'],
      myPercent: 60,
    });

    expect(saved?.defaultSplitType).toBe('percent');
    expect(saved?.members[0].splitPercent).toBe(60);
    expect(saved?.members[1].splitPercent).toBe(40);
  });

  it('grupo de viaje: respeta la moneda principal elegida', async () => {
    await service.create('u-agos', {
      name: 'Bariloche 2026',
      type: 'viaje',
      members: ['Juli'],
      currency: 'USD',
    });

    expect(saved?.currency).toBe('USD');
    expect(saved?.color).toBe('blue');
  });
});
